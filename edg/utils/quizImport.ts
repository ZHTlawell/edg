import * as XLSX from 'xlsx';

// ─── 题目数据结构（与 QuizPaperManager 一致） ─────────────────────
export interface QuestionDraft {
    type: 'single' | 'multiple';
    text: string;
    options: { id: string; label: string; text: string }[];
    answer: string[];
    score: number;
}

// ─── 列名中英文模糊匹配表 ─────────────────────────────────────────
const COL_MAP: Record<string, string[]> = {
    type: ['题型', 'type', '类型'],
    text: ['题干', 'text', '题目', '问题'],
    optionA: ['选项A', 'A', 'optionA', '选项a'],
    optionB: ['选项B', 'B', 'optionB', '选项b'],
    optionC: ['选项C', 'C', 'optionC', '选项c'],
    optionD: ['选项D', 'D', 'optionD', '选项d'],
    answer: ['正确答案', 'answer', '答案'],
    score: ['分值', 'score', '分数'],
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function resolveColumn(header: string): string | null {
    const h = header.trim();
    for (const [key, aliases] of Object.entries(COL_MAP)) {
        if (aliases.some(a => a.toLowerCase() === h.toLowerCase())) return key;
    }
    return null;
}

// ─── 核心解析函数 ──────────────────────────────────────────────────
export async function parseQuizFile(file: File): Promise<{ questions: QuestionDraft[]; errors: string[] }> {
    const errors: string[] = [];
    const questions: QuestionDraft[] = [];

    let buffer: ArrayBuffer;
    try {
        buffer = await file.arrayBuffer();
    } catch {
        return { questions: [], errors: ['文件读取失败'] };
    }

    let wb: XLSX.WorkBook;
    try {
        wb = XLSX.read(buffer, { type: 'array' });
    } catch {
        return { questions: [], errors: ['文件格式不支持，请上传 .xlsx 或 .csv'] };
    }

    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { questions: [], errors: ['文件中无工作表'] };

    const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (rows.length < 2) return { questions: [], errors: ['文件无数据行（至少需要表头+1行题目）'] };

    // 解析表头
    const headerRow = rows[0].map(String);
    const colIndex: Record<string, number> = {};
    headerRow.forEach((h, i) => {
        const key = resolveColumn(h);
        if (key) colIndex[key] = i;
    });

    // 校验必要列
    const required = ['text', 'optionA', 'optionB', 'answer'];
    const missing = required.filter(k => colIndex[k] === undefined);
    if (missing.length > 0) {
        const labels = missing.map(k => COL_MAP[k][0]);
        return { questions: [], errors: [`缺少必要列：${labels.join('、')}。请使用模板格式`] };
    }

    // 逐行解析
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) continue;

        const rowNum = i + 1;
        const cell = (key: string) => (colIndex[key] !== undefined ? String(row[colIndex[key]] ?? '').trim() : '');

        // 题干
        const text = cell('text');
        if (!text) {
            errors.push(`第${rowNum}行：题干为空，已跳过`);
            continue;
        }

        // 题型
        const rawType = cell('type').toLowerCase();
        let type: 'single' | 'multiple' = 'single';
        if (rawType === '多选' || rawType === 'multiple') {
            type = 'multiple';
        } else if (rawType && rawType !== '单选' && rawType !== 'single') {
            errors.push(`第${rowNum}行：题型「${cell('type')}」不合法，已默认为单选`);
        }

        // 选项（跳过空尾选项）
        const options: { id: string; label: string; text: string }[] = [];
        for (let j = 0; j < OPTION_LABELS.length; j++) {
            const key = `option${OPTION_LABELS[j]}`;
            const optText = cell(key);
            if (optText) {
                options.push({ id: OPTION_LABELS[j], label: OPTION_LABELS[j], text: optText });
            }
        }
        if (options.length < 2) {
            errors.push(`第${rowNum}行：有效选项不足2个，已跳过`);
            continue;
        }

        // 正确答案
        const rawAnswer = cell('answer');
        if (!rawAnswer) {
            errors.push(`第${rowNum}行：正确答案为空，已跳过`);
            continue;
        }
        const answer = rawAnswer.split(/[,，、]/).map(a => a.trim().toUpperCase()).filter(Boolean);
        const validLabels = new Set(options.map(o => o.id));
        const invalidAnswers = answer.filter(a => !validLabels.has(a));
        if (invalidAnswers.length > 0) {
            errors.push(`第${rowNum}行：答案「${invalidAnswers.join(',')}」超出选项范围，已跳过`);
            continue;
        }
        if (answer.length === 0) {
            errors.push(`第${rowNum}行：解析答案为空，已跳过`);
            continue;
        }

        // 自动推断：多个答案 → 多选
        if (answer.length > 1 && type === 'single') {
            type = 'multiple';
        }

        // 分值
        const score = parseInt(cell('score')) || 10;

        questions.push({ type, text, options, answer, score });
    }

    return { questions, errors };
}

// ─── 下载模板 ──────────────────────────────────────────────────────
export function downloadQuizTemplate() {
    const data = [
        ['题型', '题干', '选项A', '选项B', '选项C', '选项D', '正确答案', '分值'],
        ['单选', '以下哪项是 JavaScript 的基本数据类型？', 'String', 'Array', 'Object', 'Map', 'A', 10],
        ['多选', '以下哪些是 CSS 布局方式？', 'Flexbox', 'Grid', 'Float', 'Var', 'A,B,C', 15],
        ['单选', 'HTTP 状态码 404 表示？', '服务器错误', '未找到资源', '重定向', '未授权', 'B', 10],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 8 },   // 题型
        { wch: 40 },  // 题干
        { wch: 20 },  // A
        { wch: 20 },  // B
        { wch: 20 },  // C
        { wch: 20 },  // D
        { wch: 12 },  // 答案
        { wch: 8 },   // 分值
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '题目模板');
    XLSX.writeFile(wb, '题目导入模板.xlsx');
}
