import { connect, createDataItemSigner } from "@permaweb/aoconnect"
import { fromPromise, Resolved, Rejected } from 'hyper-async'
import chalk from 'chalk'
import { getPkg } from './get-pkg.js'
import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { uniqBy, prop, keys } from 'ramda'


const pkg = getPkg()
const info = {
  CU_URL: process.env.CU_URL,
  MU_URL: process.env.MU_URL
}

export function readResult(params) {

  return fromPromise(() =>
    new Promise((resolve) => setTimeout(() => resolve(params), 500))
  )().chain(fromPromise(() => connect(info).result(params)))
    // log the error messages most seem related to 503
    //.bimap(_ => (console.log(_), _), _ => (console.log(_), _))
    .bichain(fromPromise(() =>
      new Promise((resolve, reject) => setTimeout(() => reject(params), 500))
    ),
      Resolved
    )
}

export function sendMessage({ processId, wallet, tags, data }, spinner) {
  let retries = "."
  const signer = createDataItemSigner(wallet)

  const retry = () => fromPromise(() => new Promise(r => setTimeout(r, 500)))()
    .map(_ => {
      spinner ? spinner.suffixText = chalk.gray('retrying' + retries) : console.log(chalk.gray('.'))
      retries += "."
      return _
    })
    .chain(fromPromise(() => connect(info).message({ process: processId, signer, tags, data })))

  return fromPromise(() => connect(info).message({ process: processId, signer, tags, data }))()
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
    .bichain(retry, Resolved)
  //.map(result => (console.log(result), result))

}

export function spawnProcess({ wallet, src, tags }) {
  const SCHEDULER = process.env.SCHEDULER || "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA"
  const signer = createDataItemSigner(wallet)

  tags = tags.concat([{ name: 'aos-Version', value: pkg.version }])
  return fromPromise(() => connect(info).spawn({
    module: src, scheduler: SCHEDULER, signer, tags
  })
    .then(result => new Promise((resolve) => setTimeout(() => resolve(result), 500)))
  )()

}

export function monitorProcess({ id, wallet }) {
  const signer = createDataItemSigner(wallet)
  return fromPromise(() => connect(info).monitor({ process: id, signer }))()
  //.map(result => (console.log(result), result))

}

export function unmonitorProcess({ id, wallet }) {
  const signer = createDataItemSigner(wallet)
  return fromPromise(() => connect(info).unmonitor({ process: id, signer }))()
  //.map(result => (console.log(result), result))

}

export function printLive() {
  keys(globalThis.alerts).map(k => {
    if (globalThis.alerts[k].print) {
      globalThis.alerts[k].print = false
      process.stdout.write("\u001b[2K");
      process.stdout.write("\u001b[0G" + globalThis.alerts[k].data)

      globalThis.prompt = globalThis.alerts[k].prompt || "aos> "
      globalThis.setPrompt(globalThis.prompt || "aos> ")
      process.stdout.write('\n' + globalThis.prompt || "aos> ")

    }
  })

}

export async function live(id) {
  let ct = null
  let cursor = null
  let count = null
  let cursorFile = path.resolve(os.homedir() + `/.${id}.txt`)

  if (fs.existsSync(cursorFile)) {
    cursor = fs.readFileSync(cursorFile, 'utf-8')
  }

  process.stdin.on('keypress', (str, key) => {
    if (ct) {
      ct.stop()
    }
  })

  const checkLive = async () => {
    let params = { process: id, limit: "1000" }
    if (cursor) {
      params["from"] = cursor
    }

    const results = await connect(info).results(params)

    const edges = uniqBy(prop('cursor'))(results.edges.filter(function (e) {
      if (e.node?.Output?.print === true) {
        return true
      }
      if (e.cursor === cursor) {
        return false
      }
      return false
    }))

    // --- peek on previous line and if delete line if last prompt.
    // --- key event can detect 
    // count !== null && 
    if (edges.length > 0) {
      edges.map(e => {
        if (!globalThis.alerts[e.cursor]) {
          globalThis.alerts[e.cursor] = e.node?.Output
        }
      })


    }
    count = edges.length
    cursor = results.edges[results.edges.length - 1].cursor
    fs.writeFileSync(cursorFile, cursor)
    process.nextTick()
  }
  await cron.schedule('*/2 * * * * *', checkLive)



  ct = await cron.schedule('*/2 * * * * *', printLive)
  return ct
}