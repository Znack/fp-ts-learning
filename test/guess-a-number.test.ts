import { State } from 'fp-ts/lib/State'
import { drop, snoc } from 'fp-ts/lib/Array'

import { main, Program, Console, Random } from '../src/guess-a-number'

class TestData {
  constructor(
    readonly input: Array<string>,
    readonly nums: Array<number>,
    readonly output: Array<string>
  ) {}
  putStrLn(message: string): [void, TestData] {
    return [undefined, new TestData(this.input, this.nums, snoc(this.output, message))]
  }
  getStrLn(): [string, TestData] {
    return [this.input[0], new TestData(drop(1, this.input), this.nums, this.output)]
  }
  nextInt(_upper: number): [number, TestData] {
    return [this.nums[0], new TestData(this.input, drop(1, this.nums), this.output)]
  }
}

const TestTaskURI = 'TestTask'

type TestTaskURI = typeof TestTaskURI

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT<A> {
    TestTask: TestTask<A>
  }
}

class TestTask<A> extends State<TestData, A> {}

const of = <A>(a: A): TestTask<A> => new TestTask(data => [a, data])

const programTestTask: Program<TestTaskURI> = {
  finish: of
}

const consoleTestTask: Console<TestTaskURI> = {
  putStrLn: (message: string) => new TestTask(data => data.putStrLn(message)),
  getStrLn: new TestTask(data => data.getStrLn())
}

const randomTestTask: Random<TestTaskURI> = {
  nextInt: upper => new TestTask(data => data.nextInt(upper))
}

const mainTestTask = main({ ...programTestTask, ...consoleTestTask, ...randomTestTask })

describe('Random number game', () => {
  it('succeed if guess is right', () => {
    const testExample = new TestData(['Giulio', '1', 'n'], [1], [])
    expect(mainTestTask.run(testExample)).toEqual([
      undefined,
      new TestData(
        [],
        [],
        [
          'What is your name?',
          'Hello, Giulio welcome to the game!',
          'Dear Giulio, please guess a number from 1 to 5',
          'You guessed right, Giulio!',
          'Do you want to continue, Giulio?'
        ]
      )
    ])
  })
  it('succeed if guess is wrong at first time but ok at second', () => {
    const testExample = new TestData(['Giulio', '1', 'y', '2', 'n'], [3, 2], [])
    expect(mainTestTask.run(testExample)).toEqual([
      undefined,
      new TestData(
        [],
        [],
        [
          'What is your name?',
          'Hello, Giulio welcome to the game!',
          'Dear Giulio, please guess a number from 1 to 5',
          'You guessed wrong, Giulio! The number was: 3',
          'Do you want to continue, Giulio?',
          'Dear Giulio, please guess a number from 1 to 5',
          'You guessed right, Giulio!',
          'Do you want to continue, Giulio?'
        ]
      )
    ])
  })
  it('asks again if not valid answer to continue', () => {
    const testExample = new TestData(['Giulio', '1', 'O', 'n'], [1], [])
    expect(mainTestTask.run(testExample)).toEqual([
      undefined,
      new TestData(
        [],
        [],
        [
          'What is your name?',
          'Hello, Giulio welcome to the game!',
          'Dear Giulio, please guess a number from 1 to 5',
          'You guessed right, Giulio!',
          'Do you want to continue, Giulio?',
          'Do you want to continue, Giulio?'
        ]
      )
    ])
  })
  it('asks again if not valid number', () => {
    const testExample = new TestData(['Giulio', 'O', 'n'], [1], [])
    expect(mainTestTask.run(testExample)).toEqual([
      undefined,
      new TestData(
        [],
        [],
        [
          'What is your name?',
          'Hello, Giulio welcome to the game!',
          'Dear Giulio, please guess a number from 1 to 5',
          'You did not enter an integer!',
          'Do you want to continue, Giulio?'
        ]
      )
    ])
  })
})
