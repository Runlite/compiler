const chalk = require("chalk");

class Logger {
    
  
    static success(msg) {
      console.log(chalk.green(`✓ ${msg}`));
    }
  
    static error(msg, err) {
      console.error(chalk.red(`✗ ${msg}`));
      if (err?.stack) {
        console.error(chalk.red(err.stack));
      } else if (err?.message) {
        console.error(chalk.red(err.message));
      }
    }
  
    static info(msg) {
      console.log(chalk.cyan(`ℹ ${msg}`));
    }
  
    static warn(msg) {
      console.log(chalk.yellow(`⚠ ${msg}`));
    }
  }
  module.exports=Logger;
  