# 启动项目指南 (Startup Guide)

该项目是一个基于 React 和 Vite 构建的前端项目。要将本项目运行起来，请按照以下步骤操作：

## 1. 环境准备
确保您的计算机上已经安装了 [Node.js](https://nodejs.org/)。建议使用较新的 LTS 版本（例如 18.x 或 20.x）。

## 2. 安装依赖
项目的依赖项记录在 `package.json` 中。首先需要安装这些依赖：
打开终端，确保当前工作目录是项目根目录（即包含 `package.json` 的目录）：
```bash
# 切换到项目目录（如果尚未在该目录下）
cd /Users/macmini/Desktop/Edg1/edg

# 运行以下命令安装项目所需的依赖
npm install
```

## 3. 环境变量配置 （可选）
如果使用到了 Gemini 相关的 AI 服务，根据项目提供的示例，您可能需要在根目录下创建一个 `.env.local` 文件，并填入您的 API Key：
```env
GEMINI_API_KEY=your_api_key_here
```
*(注意：目前代码中仅将配置预留于 `vite.config.ts`，如果无需测试 AI 相关功能可忽略此步。)*

## 4. 启动开发服务器
依赖安装完成后，您可以运行以下命令启动本地开发环境：
```bash
npm run dev
```

成功运行后，终端会显示类似以下的信息：
```
  VITE v6.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```
您可以在浏览器中访问 `http://localhost:3000/` 来查看项目运行效果。

---
**说明：**
目前我已经为您在后台安装了依赖并启动了开发服务器，您可以直接在浏览器访问 **http://localhost:3000/** 即可看到页面！
