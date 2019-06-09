import { State } from 'fp-ts/lib/State'
import { snoc, drop } from 'fp-ts/lib/Array'

import {
  main,
  Program,
  HttpLoader,
  Console,
  IServerMultipleResponse,
  IServerUser
} from '../src/load-github-user'
import { some, none } from 'fp-ts/lib/Option'

export interface IServerMultipleResponse<R> {
  total_count: number
  incomplete_results: boolean
  items: Array<R>
}
export interface IServerUser {
  id: number
  login: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  received_events_url: string
  type: string
  score: number
}

const TestTaskURI = 'LoadGithubUserTest'
type TestTaskURI = typeof TestTaskURI
declare module 'fp-ts/lib/HKT' {
  interface URI2HKT<A> {
    LoadGithubUserTest: TestTask<A>
  }
}

class TestTask<A> extends State<TestData, A> {}

type Outputs = { logs: Array<string>; requests: Array<string> }

class TestData {
  constructor(
    readonly inputs: Array<string>,
    readonly responses: Array<IServerMultipleResponse<IServerUser>>,
    readonly output: Outputs
  ) {}
  putStrLn(message: string): [void, TestData] {
    return [
      undefined,
      new TestData(this.inputs, this.responses, {
        ...this.output,
        logs: snoc(this.output.logs, message)
      })
    ]
  }
  getStrLn(): [string, TestData] {
    return [this.inputs[0], new TestData(drop(1, this.inputs), this.responses, this.output)]
  }
  sendRequest(reqUrl: string): [IServerMultipleResponse<IServerUser>, TestData] {
    return [
      this.responses[0],
      new TestData(this.inputs, drop(1, this.responses), {
        ...this.output,
        requests: snoc(this.output.requests, reqUrl)
      })
    ]
  }
}
const of = <A>(a: A): TestTask<A> => new TestTask(data => [a, data])

const programTestTask: Program<TestTaskURI> = {
  finish: of
}

const consoleTestTask: Console<TestTaskURI> = {
  putStrLn: (message: string) => new TestTask(data => data.putStrLn(message)),
  getStrLn: new TestTask(data => data.getStrLn())
}
const httpLoaderTestTask: HttpLoader<TestTaskURI> = {
  httpLoad: (requestUrl: string) => new TestTask(data => data.sendRequest(requestUrl))
}

const mainTestTask = main({ ...programTestTask, ...consoleTestTask, ...httpLoaderTestTask })

describe('Load Github user', () => {
  it('should find and load existed user', () => {
    const testExample = new TestData(
      ['mojombo'],
      [
        {
          total_count: 12,
          incomplete_results: false,
          items: [
            {
              login: 'mojombo',
              id: 1,
              avatar_url:
                'https://secure.gravatar.com/avatar/25c7c18223fb42a4c6ae1c8db6f50f9b?d=" \
                + "https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png',
              gravatar_id: '',
              url: 'https://api.github.com/users/mojombo',
              html_url: 'https://github.com/mojombo',
              followers_url: 'https://api.github.com/users/mojombo/followers',
              subscriptions_url: 'https://api.github.com/users/mojombo/subscriptions',
              organizations_url: 'https://api.github.com/users/mojombo/orgs',
              repos_url: 'https://api.github.com/users/mojombo/repos',
              received_events_url: 'https://api.github.com/users/mojombo/received_events',
              type: 'User',
              score: 105.47857
            }
          ]
        }
      ],
      { logs: [], requests: [] }
    )
    expect(mainTestTask.run(testExample)).toEqual([
      some(105.47857),
      new TestData([], [], {
        logs: ['Who are you?', 'Loading your Github profile...', 'Your score is 105.47857'],
        requests: ['https://api.github.com/search/users?q=mojombo']
      })
    ])
  })
  it('should log about not found user', () => {
    const testExample = new TestData(
      ['mojombo'],
      [
        {
          total_count: 0,
          incomplete_results: false,
          items: []
        }
      ],
      { logs: [], requests: [] }
    )
    expect(mainTestTask.run(testExample)).toEqual([
      none,
      new TestData([], [], {
        logs: ['Who are you?', 'Loading your Github profile...', 'No such profile found!'],
        requests: ['https://api.github.com/search/users?q=mojombo']
      })
    ])
  })
})
