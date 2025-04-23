function view(
  _target: any,
  _context: ClassMethodDecoratorContext
): void {
  // This decorator marks methods as "view"
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
}