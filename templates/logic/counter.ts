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

class Project {
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
}