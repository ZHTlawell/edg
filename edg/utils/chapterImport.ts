/**
 * 课程章节批量导入工具
 * 作用：解析 Excel/CSV 文件为章节 + 课时结构，并提供模板下载
 */
import * as XLSX from 'xlsx';

// ─── 数据结构 ──────────────────────────────────────────────────────
// 章节草稿结构：标题 + 课时列表（用于导入后批量入库）
export interface ChapterDraft {
    title: string;
    lessons: { title: string }[];
}

// ─── 列名模糊匹配表 ────────────────────────────────────────────────
const COL_MAP: Record<string, string[]> = {
    chapter: ['章节名称', '章节', 'chapter', 'chapter_name'],
    lesson: ['课时名称', '课时', 'lesson', 'lesson_name'],
};

// 根据 Excel 表头找出对应的标准字段名（中英文模糊匹配）
function resolveColumn(header: string): string | null {
    const h = String(header || '').trim();
    for (const [key, aliases] of Object.entries(COL_MAP)) {
        if (aliases.some(a => a.toLowerCase() === h.toLowerCase())) return key;
    }
    return null;
}

// ─── 核心解析函数 ──────────────────────────────────────────────────
// 解析用户上传的章节 Excel 文件；返回章节列表 + 行级错误信息
export async function parseChapterFile(file: File): Promise<{ chapters: ChapterDraft[]; errors: string[] }> {
    const errors: string[] = [];
    const chapterMap = new Map<string, string[]>();

    let buffer: ArrayBuffer;
    try {
        buffer = await file.arrayBuffer();
    } catch {
        return { chapters: [], errors: ['文件读取失败'] };
    }

    let wb: XLSX.WorkBook;
    try {
        wb = XLSX.read(buffer, { type: 'array' });
    } catch {
        return { chapters: [], errors: ['文件格式不支持，请上传 .xlsx 或 .csv'] };
    }

    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { chapters: [], errors: ['文件中无工作表'] };

    const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (rows.length < 2) return { chapters: [], errors: ['文件无数据行（至少需要表头+1行）'] };

    const headerRow = rows[0].map(String);
    const colIndex: Record<string, number> = {};
    headerRow.forEach((h, i) => {
        const key = resolveColumn(h);
        if (key) colIndex[key] = i;
    });

    const required = ['chapter', 'lesson'];
    const missing = required.filter(k => colIndex[k] === undefined);
    if (missing.length > 0) {
        const labels = missing.map(k => COL_MAP[k][0]);
        return { chapters: [], errors: [`缺少必要列：${labels.join('、')}。请使用模板格式`] };
    }

    // 保持章节出现顺序
    const chapterOrder: string[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) continue;
        const rowNum = i + 1;

        const chapter = String(row[colIndex.chapter] ?? '').trim();
        const lesson = String(row[colIndex.lesson] ?? '').trim();

        if (!chapter) { errors.push(`第 ${rowNum} 行：章节名称为空`); continue; }
        if (!lesson) { errors.push(`第 ${rowNum} 行：课时名称为空`); continue; }

        if (!chapterMap.has(chapter)) {
            chapterMap.set(chapter, []);
            chapterOrder.push(chapter);
        }
        chapterMap.get(chapter)!.push(lesson);
    }

    const chapters: ChapterDraft[] = chapterOrder.map(title => ({
        title,
        lessons: (chapterMap.get(title) || []).map(l => ({ title: l })),
    }));

    return { chapters, errors };
}

// ─── 下载模板 ──────────────────────────────────────────────────────
// 生成并下载章节导入 Excel 模板（含示例数据 + 使用说明工作表）
export function downloadChapterTemplate() {
    const data = [
        ['章节名称', '课时名称'],
        ['第一章  入门基础', '1.1 课程介绍与学习路径'],
        ['第一章  入门基础', '1.2 开发环境搭建'],
        ['第一章  入门基础', '1.3 第一个 Hello World 程序'],
        ['第二章  核心概念', '2.1 变量与数据类型'],
        ['第二章  核心概念', '2.2 条件判断与循环'],
        ['第二章  核心概念', '2.3 函数定义与调用'],
        ['第三章  进阶实战', '3.1 面向对象编程'],
        ['第三章  进阶实战', '3.2 异步编程模型'],
        ['第三章  进阶实战', '3.3 模块化与包管理'],
        ['第四章  项目实战', '4.1 需求分析与架构设计'],
        ['第四章  项目实战', '4.2 核心功能开发'],
        ['第四章  项目实战', '4.3 测试部署上线'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 35 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '章节结构模板');

    const guide = [
        ['字段', '是否必填', '说明'],
        ['章节名称', '必填', '相同的章节名称会归为同一章（按出现顺序）'],
        ['课时名称', '必填', '每一行代表一个课时，建议加上序号'],
        ['', '', ''],
        ['使用示例', '', ''],
        ['章节名称', '课时名称', ''],
        ['第一章  基础', '1.1 概述', ''],
        ['第一章  基础', '1.2 环境搭建', ''],
        ['第二章  进阶', '2.1 高级特性', ''],
        ['', '', ''],
        ['⚠️ 注意', '', ''],
        ['1. 导入时会追加到现有章节末尾，不会覆盖已有章节', '', ''],
        ['2. 如需先清空，请手动删除再导入', '', ''],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(guide);
    ws2['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws2, '使用说明');

    XLSX.writeFile(wb, '课程章节结构导入模板.xlsx');
}
