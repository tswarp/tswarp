function view(
  _target: any,
  _context: ClassMethodDecoratorContext
): void {
  // This decorator marks methods as "view"
  // Add any additional logic if required
}

function write(
  _target: any,
  _context: ClassMethodDecoratorContext
): void {
  // This decorator marks methods as "write"
  // Add any additional logic if required
}

class Counter {
  private number: number;
  private active: boolean;

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
}