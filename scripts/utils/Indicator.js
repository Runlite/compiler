const chalk = require("chalk");

class ProgressIndicator {
    constructor(text) {
      this.text = text;
      this.interval = null;
      this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
      this.frameIndex = 0;
    }
  
    start() {
      process.stdout.write("\n");
      this.interval = setInterval(() => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `${chalk.cyan(this.frames[this.frameIndex])} ${this.text}`
        );
        this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      }, 80);
      return this;
    }
  
    stop(success = true, message = "") {
      clearInterval(this.interval);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      const symbol = success ? chalk.green("✓") : chalk.red("✗");
      process.stdout.write(`${symbol} ${message || this.text}\n`);
    }
  }
module.exports=ProgressIndicator;