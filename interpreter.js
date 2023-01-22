const variables = {};

const Types = Object.freeze({
  "str": "str",
  "int": "int",
  "float": "float",
  "bool": "bool",
  "obj": "obj"
})

const Defaults = Object.freeze({
  "str": "",
  "int": 0,
  "float": 0,
  "bool": false,
  "obj": {}
})

function evalRegex(regex, str) {
  let m;
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    return m
  }
}

const { parse } = require('@iarna/toml');
const fs = require('node:fs');
const q = require('readline-sync').question

let package;

if (fs.existsSync('./package.toml')) {
  package = parse(fs.readFileSync('./package.toml', 'utf8'))
}

const cKeywords = package?.imports?.keywords

function checkTypeAndAssign(v, args) {
  switch (v.type) {
    case Types.str:
      let str = evalRegex(/"(.+)"|'(.+)'/g, args.join(' ')) ?? []
      if (str.length) {
        str = str[1]
      } else {
        // Check for variables with the name
        let a = Object.keys(variables).filter(x => x === args.join(' '))[0]
  
        if (a.length) {
          str = `${variables[a].value}`
        } else {
          return new Error(`Could not find variable "${args.join(" ")}". Did you mean to stringify the value?`)
        }
      }
  
      v.value = str
      break;
  
    case Types.int:
      let int = parseInt(args.join(' '));
  
      if (isNaN(int)) {
        // Check for variables with the name
        let a = Object.keys(variables).filter(x => x === args.join(' '))[0]
  
        if (a.length) {
          int = parseInt(variables[a].value)
        } else {
          return new Error(`Could not find variable "${args.join(" ")}". The value you passed may also not be a valid integer.`)
        }
      }
  
      v.value = int
      break;
  
    case Types.float:
      let float = parseFloat(args.join(' '));
  
      if (isNaN(float)) {
        // Check for variables with the name
        let a = Object.keys(variables).filter(x => x === args.join(' '))[0]
  
        if (a.length) {
          int = parseFloat(variables[a].value)
        } else {
          return new Error(`Could not find variable "${args.join(" ")}". The value you passed may also not be a valid float.`)
        }
      }
  
      v.value = float
      break;
  
    case Types.bool:
      let bool;
  
      if (["true", "false"].includes(args.join(" "))) {
        bool = ("true"===args.join(" "))
      } else {
        // Check for variables with the name
        let a = Object.keys(variables).filter(x => x === args.join(' '))[0]
  
        if (a.length) {
          bool = ("true"===variables[a].value)
        } else {
          return new Error(`Could not find variable "${args.join(" ")}". The value you passed may also not be a valid boolean.`)
        }
      }
  
      v.value = bool
      break;
  
    case Types.obj:
      return new Error("To edit an object, edit its properties manually.")
  }
}

const keywords = {
  ...(cKeywords ? require(cKeywords) : {}),
  declare(args) {
    // DECLARE var : type
    // args = [var, ":", type]
    let argsTrimmed = args.filter(x=>!!x.trim())

    if (!argsTrimmed[0]) return new Error(`Please specify a variable name`)

    if (argsTrimmed[0].includes('.')) {
      let a = { value: variables }
      oopHackyStuff = argsTrimmed[0].split('.')

      for (let e of oopHackyStuff) {
        let i = oopHackyStuff.indexOf(e)

        if (a.value[e]) {
          if (i != 0) return new Error(`Property ${e} is already declared`)
        }

        a = a.value[e]
      }

      variables[oopHackyStuff[0]].value[oopHackyStuff[1]] =  {
        type: Types[argsTrimmed[2]],
        value: Defaults[argsTrimmed[2]]
      }

      return;
    }

    if (argsTrimmed[1] !== ":") return new Error(`Expected ":" when declaring variable, got "${argsTrimmed[1] || ""}" instead`)

    if (!argsTrimmed[2]) return new Error(`Specify a type for variable "${argsTrimmed[0]}"`)

    if (!Types[argsTrimmed[2]]) return new Error(`Invalid type for variable "${argsTrimmed[0]}"`)
    
    let variable = {
      type: Types[argsTrimmed[2]],
      value: Defaults[argsTrimmed[2]]
    }

    if (variables[argsTrimmed[0]]) return new Error(`Variable "${argsTrimmed[0]}" already declared`)

    variables[argsTrimmed[0]] = variable
  },
  assign(args) {
    // ASSIGN var = val
    // args = [var, "=", ...val]
    let varName = args.shift();
    let e = args.shift();

    if (!varName) return new Error(`Please specify a variable name`)

    let oopHackyStuff;
    let oopHackyStuff2 = []

    if (varName.includes('.')) {
      let a = { value: variables }
      oopHackyStuff = varName.split('.')

      for (let e of oopHackyStuff) {
        let i = oopHackyStuff.indexOf(e)

        if (!a.value[e]) {
          if (i == 0) return new Error(`Variable ${e} isn't declared`)
          else return new Error(`Property ${e} isn't declared`)
        }

        a = a.value[e]
      }

      return checkTypeAndAssign(variables[oopHackyStuff[0]].value[oopHackyStuff[1]], args)
    }

    if (!variables[varName]) return new Error(`Variable ${varName} isn't declared`)

    if (e !== "=") return new Error(`Expected "=" when assigning value to variable, got "${e}" instead`)

    if (!args.join(' ')) return new Error(`Specify a value for variable "${varName}"`)

    // Types. yay.
    return checkTypeAndAssign(variables[varName], args)
  },
  // in(args) {
  //   // args = [...question, "=", var]
  //   // IN "question" = var_name

  //   args = args.join(' ').split('=').map((x,i,a)=>i==a.length-1?x.trim():x)

  //   let varName = args.pop();

  //   if (!variables[varName]) return new Error(`Variable "${varName}" is not declared`)

  //   if (variables[varName].type != Types.str) return new Error("Currently, the \"IN\" keyword only supports string values.")
    
  //   let question = args.join('=').trim()

  //   keywords.out([question])
  //   keywords.assign([varName, "=", `"${q("> ")}"`])
  //   return;
  // },
  out(args) {
    // args = [...out]
    // OUT variable || OUT value

    // Check if it's a variable first
    let a = Object.keys(variables).filter(x => x === args.join(' '))[0]

    if (a?.length) {
      return String(variables[a].value)
    } else {
      // Check for string
      let str = evalRegex(/"(.+)"|'(.+)'/g, args.join(' ')) ?? []

      if (str.length) return str[1]

      // Check for float (also checks for int)
      let float = parseFloat(args.join(' '))

      if (!isNaN(float)) return String(float)

      // Check for bool
      if (["true", "false"].includes(args.join(" "))) return args.join(' ')

      // Nothing's passed, so we error
      return new Error(`Could not find variable "${args.join(" ")}".`)
    }
  },
  "debug_vars"() {  
    return JSON.stringify(variables, null, 2)
  }
}

module.exports = (lines) => {
  let output = []
  lines = lines.split('\n')

  for (let line of lines) {
    // Comments
    if (line.startsWith('@') || !line.length) continue;
  
    const args = line.trim().split(' ')
    const command = args.shift().toLowerCase();

    if (keywords[command]) {
      const result = keywords[command](args)

      if (result instanceof Array) {
        output.push(...result)
      } else if (result instanceof Error) {
        output = [
          "\u001b[31m" + `[L${lines.indexOf(line)+1}]: ${result.message}` + "\u001b[39m"
        ]
        break;
      } else if (typeof result !== "undefined") {
        output.push(result)
      }
    } else {
      output = [
        "\u001b[31m" + `[L${lines.indexOf(line)+1}]: Unknown keyword "${command}"` + "\u001b[39m"
      ]
      break;
    }
  }

  return output.length ? output.join('\n') : ""
}