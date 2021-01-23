import { Cmd } from "../cmd";
import { initMainCli } from "./main";
import { initAccountsCli } from "./accounts";

export function initCli(cmd: Cmd) {
  cmd.lolire.options.initCli(cmd);
  initMainCli(cmd);
  initAccountsCli(cmd);
}