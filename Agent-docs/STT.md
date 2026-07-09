在网页端（React）实现免费且多语言的语音转文本，最完美的方案依然是直接调用浏览器原生的 **Web Speech API** 中的 **`SpeechRecognition`**。

这个方案不仅**绝对 100% 免费**，而且是由浏览器底层的语音引擎（如 Chrome 的 Google 语音识别服务器）提供算力，**完全不消耗你自己的服务器资源**，更不需要在 Node.js 中处理复杂的音频文件上传。

为了让你的 Demo 能够同时精准识别**中文、英语、甚至粤语**，你需要在 React 前端代码中通过控制 `lang` 参数来实现。

---

### 1. 核心原理：通过 `lang` 参数控制语言

Web Speech API 的识别精度极高，只要你给它指定正确的 BCP 47 语言代码（Language Tag）：

- **普通话/中文：** `zh-CN`
- **美式英语：** `en-US`（最适合练口语）
- **粤语（广东话/香港话）：** `zh-HK` 或 `zh-TW`

---

### 2. React 极简实现代码

你可以在 React 组建中写一个控制函数。为了支持多语言，你可以定义一个下拉菜单让用户切换，或者让“贾维斯”默认开启某种语言：

```tsx
import React, { useState, useRef } from "react";

export const SpeechToTextDemo = () => {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  // 默认设置为美式英语，你可以动态修改这个值：'zh-CN' (中文) 或 'zh-HK' (粤语)
  const [currentLang, setCurrentLang] = useState("en-US");

  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    // 兼容 Chrome 和 Firefox 等浏览器
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("您的浏览器不支持 Web Speech API，请使用 Chrome 浏览器。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // 核心配置
    recognition.lang = currentLang; // 传入语言代码：en-US / zh-CN / zh-HK
    recognition.continuous = false; // 短句识别，用户停顿自动结束
    recognition.interimResults = false; // 只返回最终确定的文本，不返回中间猜测过程

    recognition.onstart = () => {
      setIsRecording(true);
      console.log(`开始录音，当前识别语言: ${currentLang}`);
    };

    recognition.onresult = (event: any) => {
      // 获取识别到的最后一句话的文本
      const resultText = event.results[0][0].transcript;
      setText(resultText);

      // 💡 在这里，你可以直接通过 Axios / Fetch 将 resultText 发送给你的 Node.js 后端接口！
      console.log("识别结果：", resultText);
    };

    recognition.onerror = (event: any) => {
      console.error("识别出错: ", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log("录音结束");
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>Web Speech STT 测试面板</h3>

      {/* 语言切换器 */}
      <label>选择识别语言：</label>
      <select
        value={currentLang}
        onChange={(e) => setCurrentLang(e.target.value)}
      >
        <option value="en-US">English (US)</option>
        <option value="zh-CN">简体中文 (Mandarin)</option>
        <option value="zh-HK">粵語 (Cantonese - 香港)</option>
      </select>

      <div style={{ margin: "20px 0" }}>
        <button onClick={isRecording ? stopListening : startListening}>
          {isRecording ? "🔴 正在录音（点击停止）" : "🎤 开始说话"}
        </button>
      </div>

      <div
        style={{ background: "#f5f5f5", padding: "15px", borderRadius: "5px" }}
      >
        <strong>识别到的文字：</strong>
        <p>{text || "暂无声音输入..."}</p>
      </div>
    </div>
  );
};
```

---

### 3. 这个方案的优缺点（MVP阶段评估）

- **优点：**

1. **绝对零门槛：** 几行 JavaScript 代码直接搞定，不需要配密钥，不需要开腾讯云、阿里云的语音识别服务。
2. **粤语识别极准：** Chrome 背后调用的是 Google 强大的语音识别大模型，它对粤语（甚至夹杂英文字母的港式粤语）的识别率高得惊人。
3. **超低延迟：** 浏览器本地流式处理，用户一说完，文本秒出。

- **缺点：**
- **环境依赖：** 严重依赖浏览器（Chrome 体验完美，Safari 表现一般，部分套壳浏览器可能失效）。
- **硬件迁移限制：** 记住，这个方法**只能用在网页端**。
