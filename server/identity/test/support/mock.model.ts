export abstract class MockModel<T> {
  protected abstract entityStub: T;

  constructor(createEntityData: T) {
    this.constructorSpy(createEntityData);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructorSpy(_createdEntityData: T): void {}

  findOne(): { exec: () => T } {
    return {
      exec: (): T => this.entityStub,
    };
  }

  find(): { exec: () => T[] } {
    return {
      exec: (): T[] => [this.entityStub],
    };
  }

  async save(): Promise<T> {
    return this.entityStub;
  }

  async findOneAndUpdate(): Promise<T> {
    return this.entityStub;
  }
}