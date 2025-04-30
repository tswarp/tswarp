import { view, write, payable, transfer, msg, Address } from 'tswarp';

class Counter {
  private number: number;
  private active: boolean;
  private amount: number;
  private threshold: number;

  @view
  getNumber(): number {
      return this.number;
  }

  @view
  getActive(): boolean {
      return this.active;
  }

  @write
  setNumber(newNumber: number): void {
      this.number = newNumber;
  }

  @write
  setActive(newActive: boolean): void {
      this.active = newActive;
  }

  @write
  setNewNum(newActive: number): void {
      this.number = newActive;
  }

  @write
  addNumber(newNumber: number): void {
      let currentNumber = this.number;
      this.number = currentNumber + newNumber;
  }

  @write
  subNumber(newNumber: number): void {
      let currentNumber = this.number;
      this.number = currentNumber - newNumber;
  }

  @write
  mulNumber(newNumber: number): void {
      let currentNumber = this.number;
      this.number = currentNumber * newNumber;
  }

  @write
  divNumber(newNumber: number): void {
      let currentNumber = this.number;
      this.number = currentNumber / newNumber;
  }

  @write
    setActiveValue(): void {
        this.active = false;
    }

    @write
    increment(): void {
      let currentNumber = this.number;
      this.number = currentNumber + 1;
    }

    @write
    checkAndUpdate(value: number): void {
      let currentCount = this.number;
      let currentThreshold = this.threshold;
      if (value == currentCount) {
        this.number = value + 10;
      } else if (value < currentCount) {
        this.number = currentCount - value;
      } else if (value > currentCount && value >= currentThreshold) {
        this.number = currentCount + value;
      } else if (value <= currentThreshold) {
        this.number = currentThreshold - value;
      } else {
        this.number = 0;
      }
    }

    @payable
    donateTo(recipientAddress: Address): void {
      let sendAmount = msg.value();
      transfer(recipientAddress, sendAmount);
    }

    @payable
    add_from_msg_value(): void {
      let newAmount = this.amount;
      this.amount = newAmount + msg.value();
    }
}