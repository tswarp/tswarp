function view(
  _target: any,
  _context: ClassMethodDecoratorContext
) {
  // View decorator just marks the method
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