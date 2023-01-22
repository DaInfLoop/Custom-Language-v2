#!/usr/bin/env node

const argv = process.argv.slice(2);
const q = require('readline-sync').question;
const fs = require('node:fs')
const r = require('node:repl')
const toml = require('@iarna/toml')

if (!argv.length) {
  // Print help message

  console.log(
    [
      `                                                                 
 ██████╗██╗   ██╗███████╗████████╗ ██████╗ ███╗   ███╗              
██╔════╝██║   ██║██╔════╝╚══██╔══╝██╔═══██╗████╗ ████║              
██║     ██║   ██║███████╗   ██║   ██║   ██║██╔████╔██║              
██║     ██║   ██║╚════██║   ██║   ██║   ██║██║╚██╔╝██║              
╚██████╗╚██████╔╝███████║   ██║   ╚██████╔╝██║ ╚═╝ ██║              
 ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝              
                                                                    
            ██╗      █████╗ ███╗   ██╗ ██████╗     ██╗   ██╗██████╗ 
            ██║     ██╔══██╗████╗  ██║██╔════╝     ██║   ██║╚════██╗
            ██║     ███████║██╔██╗ ██║██║  ███╗    ██║   ██║ █████╔╝
            ██║     ██╔══██║██║╚██╗██║██║   ██║    ╚██╗ ██╔╝██╔═══╝ 
            ███████╗██║  ██║██║ ╚████║╚██████╔╝     ╚████╔╝ ███████╗
            ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝       ╚═══╝  ╚══════╝`,
      "",
      "Custom Language v2 - Made proudly by haroon",
      "",
      "--init: Initalize a Custom Language \"package\".",
      "--repl or -r: Starts a Custom Language REPL.",
      "--run or -s: Runs the current directory."
    ].join('\n')
  )
} else if (["--init"].includes(argv[0])) {
  const package = {
    name: process.cwd().split('/').slice(-1)[0],
    description: null,
    version: "1.0.0",
    entry_point: "main.lang"
  }

  let gitconfig = {};

  if (fs.existsSync('.git/config')) {
    gitconfig = require('ini').parse(fs.readFileSync('.git/config', 'utf-8'))
  }

  const git = {
    repo: gitconfig['remote "origin"']?.url
  }

  package.name = q(`name: (default: ${package.name}) `) || package.name
  package.description = q(`description: `) || null
  package.version = q(`version: (default: 1.0.0) `) || "1.0.0"
  package.entry_point = q("entry point: (default: main.lang) ") || "main.lang"

  git.repo = q(`git repo: ${git.repo ? `(default: ${git.repo}) ` : ""}`) || git.repo

  const data = toml.stringify({
    package,
    ...(git.repo ? { git } : {})
  })
  
  console.log("Is this correct?")
  console.log(`\n${data}\n\n`)

  if ((q("Proceed? (default: yes) ")||"yes") === "yes") {
    fs.writeFileSync('./package.toml', data)
    console.log('debug yes')
  } else {
    console.log("Aborted.\n")
  }
} else if (["--repl", "-r"].includes(argv[0])) {
  const i = require('./interpreter')
  r.start({
    eval: (cmd, context, filename, callback) => {
      cmd = cmd.trim()

      console.log(i(cmd) || '\u001b[90mundefined\u001b[39m')
      
      callback()
    }
  })
} else if (["--run", "-s"].includes(argv[0])) {
  const i = require('./interpreter')
  if (!fs.existsSync('package.toml') && !args[1]) {
    console.log("\u001b[31m" + "This directory does not have a \"package.toml\" file. Create one by using the \"--init\" arg." + "\u001b[39m")
  } else {
    const fileToRun = argv[1] || toml.parse(fs.readFileSync('package.toml', 'utf8')).package.entry_point

    if (!fs.existsSync(fileToRun)) {
      console.log("\u001b[31m" + `Cannot find file ${fileToRun}` + "\u001b[39m")
    } else {
      let file = fs.readFileSync(fileToRun, 'utf8')
      let out = i(file)

      process.stdout.write(out ? out + "\n": "")
    }
  }
}