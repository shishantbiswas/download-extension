import { Storage } from "@plasmohq/storage"

type Logs = {
  url: string
  pageUrl: string
  title: string
  initiator: string
  favicon: string
  timeStamp: number
}

const saveLog = async (details: chrome.webRequest.WebRequestBodyDetails) => {
  // if (/https:\/\/[^\s'"]*?\.(vtt|m3u8)/gm.test(details.url)) {
  //   console.log(details)
  // }
  if (/https:\/\/[^\s'"]*?\.m3u8/gm.test(details.url)) {
    const storage = new Storage()
    const logs = ((await storage.get("request_logs")) as Logs[]) || []

    const [tab] = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    })
    const log = {
      url: details.url,
      pageUrl: tab?.url || "N/A",
      initiator: details.initiator,
      title: tab?.title || "N/A",
      favicon: tab?.favIconUrl || null,
      timeStamp: details.timeStamp
    } satisfies Logs

    logs.push(log)

    if (logs.length > 10) logs.shift()

    await storage.set("request_logs", logs)
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    saveLog(details).catch(console.error)
  },
  {
    urls: ["*://*/*"],
    types: ["xmlhttprequest"]
  }
)
