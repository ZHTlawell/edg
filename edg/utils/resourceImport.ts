/**
 * 课程资源批量导入工具
 * 作用：解析 Excel/CSV 为资源草稿（视频/文档/音频/图片），并提供模板下载
 */
import * as XLSX from 'xlsx';

// ─── 资源数据结构 ──────────────────────────────────────────────────
// 资源草稿：导入后入库前的单条资源
export interface ResourceDraft {
    title: string;
    description?: string;
    type: 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'IMAGE' | 'OTHER';
    url: string;
    standardCode?: string;
}

// ─── 列名模糊匹配表 ────────────────────────────────────────────────
const COL_MAP: Record<string, string[]> = {
    title: ['资源标题', '标题', 'title', 'name'],
    description: ['资源说明', '说明', 'description', 'desc'],
    type: ['资源类型', '类型', 'type'],
    url: ['资源链接', '链接', 'url', '外链'],
    standardCode: ['课程标准代码', '标准代码', 'code', 'standard_code'],
};

const TYPE_MAP: Record<string, ResourceDraft['type']> = {
    '视频': 'VIDEO', 'video': 'VIDEO', 'VIDEO': 'VIDEO',
    '文档': 'DOCUMENT', 'document': 'DOCUMENT', 'DOCUMENT': 'DOCUMENT',
    '音频': 'AUDIO', 'audio': 'AUDIO', 'AUDIO': 'AUDIO',
    '图片': 'IMAGE', 'image': 'IMAGE', 'IMAGE': 'IMAGE',
    '其他': 'OTHER', 'other': 'OTHER', 'OTHER': 'OTHER',
};

// Excel 表头中英文模糊匹配
function resolveColumn(header: string): string | null {
    const h = String(header || '').trim();
    for (const [key, aliases] of Object.entries(COL_MAP)) {
        if (aliases.some(a => a.toLowerCase() === h.toLowerCase())) return key;
    }
    return null;
}

// ─── 核心解析函数 ──────────────────────────────────────────────────
// 解析资源导入文件：校验类型 / URL 格式，返回资源列表 + 错误信息
export async function parseResourceFile(file: File): Promise<{ resources: ResourceDraft[]; errors: string[] }> {
    const errors: string[] = [];
    const resources: ResourceDraft[] = [];

    let buffer: ArrayBuffer;
    try {
        buffer = await file.arrayBuffer();
    } catch {
        return { resources: [], errors: ['文件读取失败'] };
    }

    let wb: XLSX.WorkBook;
    try {
        wb = XLSX.read(buffer, { type: 'array' });
    } catch {
        return { resources: [], errors: ['文件格式不支持，请上传 .xlsx 或 .csv'] };
    }

    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { resources: [], errors: ['文件中无工作表'] };

    const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (rows.length < 2) return { resources: [], errors: ['文件无数据行（至少需要表头+1行）'] };

    const headerRow = rows[0].map(String);
    const colIndex: Record<string, number> = {};
    headerRow.forEach((h, i) => {
        const key = resolveColumn(h);
        if (key) colIndex[key] = i;
    });

    const required = ['title', 'type', 'url'];
    const missing = required.filter(k => colIndex[k] === undefined);
    if (missing.length > 0) {
        const labels = missing.map(k => COL_MAP[k][0]);
        return { resources: [], errors: [`缺少必要列：${labels.join('、')}。请使用模板格式`] };
    }

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) continue;
        const rowNum = i + 1;

        const cell = (key: string) => String(row[colIndex[key]] ?? '').trim();

        const title = cell('title');
        if (!title) { errors.push(`第 ${rowNum} 行：资源标题为空`); continue; }

        const typeRaw = cell('type');
        const type = TYPE_MAP[typeRaw];
        if (!type) { errors.push(`第 ${rowNum} 行：未知资源类型「${typeRaw}」，应为视频/文档/音频/图片/其他`); continue; }

        const url = cell('url');
        if (!url) { errors.push(`第 ${rowNum} 行：资源链接为空`); continue; }
        if (!/^https?:\/\//i.test(url)) { errors.push(`第 ${rowNum} 行：链接格式无效（应以 http:// 或 https:// 开头）`); continue; }

        const description = colIndex.description !== undefined ? cell('description') : '';
        const standardCode = colIndex.standardCode !== undefined ? cell('standardCode') : '';

        resources.push({
            title,
            description: description || undefined,
            type,
            url,
            standardCode: standardCode || undefined,
        });
    }

    return { resources, errors };
}

// ─── 下载模板 ──────────────────────────────────────────────────────
// 生成并下载资源 Excel 导入模板（含示例 + 使用说明工作表）
export function downloadResourceTemplate() {
    const data = [
        ['资源标题', '资源说明', '资源类型', '资源链接', '课程标准代码'],
        ['JavaScript 入门教程', '零基础讲解 JS 语法', '视频', 'https://example.com/js-intro.mp4', 'STD001'],
        ['React Hooks 完全指南', 'useState / useEffect 实战演示', '视频', 'https://www.bilibili.com/video/BV1234', ''],
        ['CSS 布局速查表.pdf', 'Flexbox + Grid 备忘录', '文档', 'https://example.com/css-layout.pdf', 'STD001'],
        ['产品经理入门音频课', '播客节目', '音频', 'https://example.com/pm-podcast.mp3', ''],
        ['UI 设计参考图', '配色方案示例', '图片', 'https://example.com/ui-ref.png', 'STD002'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 28 },
        { wch: 30 },
        { wch: 10 },
        { wch: 50 },
        { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '资源导入模板');

    // 第二个工作表：使用说明
    const guide = [
        ['字段', '是否必填', '说明'],
        ['资源标题', '必填', '显示名称，建议简洁明了'],
        ['资源说明', '选填', '简短描述，用于学员预览'],
        ['资源类型', '必填', '可选值：视频 / 文档 / 音频 / 图片 / 其他'],
        ['资源链接', '必填', '必须以 http:// 或 https:// 开头的有效 URL'],
        ['课程标准代码', '选填', '关联的课程标准 Code（可在课程体系管理中查询）'],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(guide);
    ws2['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws2, '使用说明');

    XLSX.writeFile(wb, '课程资源导入模板.xlsx');
}
