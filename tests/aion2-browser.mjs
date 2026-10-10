import {checkAion2Checklist} from './aion2-checklist-browser.mjs'
import {checkAion2Content} from './aion2-content-browser.mjs'
import {checkAion2Safety} from './aion2-checklist-safety-browser.mjs'
import {finish} from './browser-client.mjs'

await checkAion2Checklist()
await checkAion2Content()
await checkAion2Safety()
finish()
