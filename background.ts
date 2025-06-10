import { Storage } from "@plasmohq/storage"

const storage = new Storage()

type Logs = {
  url: string
  pageUrl:string
  title: string
  favicon: string
  timeStamp: number
}

const getLogs = async () => {
  return ((await storage.get("request_logs")) as Logs[]) || []
}

const saveLog = async (details: chrome.webRequest.WebRequestBodyDetails) => {
  const logs = await getLogs()

  const [tab] = await new Promise<chrome.tabs.Tab[]>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, resolve)
  })

  logs.push({
    url: details.url,
    pageUrl: tab?.url || "N/A",
    title: tab?.title || "N/A",
    favicon: tab?.favIconUrl || "",
    timeStamp: details.timeStamp
  })

  if (logs.length > 10) logs.shift()

  await storage.set("request_logs", logs)
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (/\/master.m3u8(\?|$)/.test(details.url) && details.method === "GET") {
      console.log(details)
      saveLog(details).then(console.log).catch(console.error)
    }
  },
  {
    urls: ["*://*/*"],
    types: ["xmlhttprequest"]
  }
)
