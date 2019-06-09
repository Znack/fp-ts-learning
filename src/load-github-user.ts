import { URIS, Type } from 'fp-ts/lib/HKT'
import { Option, none, some } from 'fp-ts/lib/Option'
import { head } from 'fp-ts/lib/Array'
import { compose } from 'fp-ts/lib/function'
import { Monad } from 'fp-ts/lib/Monad'

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

interface ProgramSyntax<F extends URIS, A> {
  map: <B>(f: (a: A) => B) => _<F, B>
  chain: <B>(f: (a: A) => _<F, B>) => _<F, B>
}
type _<F extends URIS, A> = Type<F, A> & ProgramSyntax<F, A>

export interface Program<F extends URIS> {
  finish: <A>(a: A) => _<F, A>
}
export interface HttpLoader<F extends URIS> {
  httpLoad: (requestUrl: string) => _<F, IServerMultipleResponse<IServerUser>>
}
export interface Console<F extends URIS> {
  putStrLn: (a: string) => _<F, void>
  getStrLn: _<F, string>
}

interface Main<F extends URIS> extends Program<F>, HttpLoader<F>, Console<F> {}

const githubUrl = (q: string) => `https://api.github.com/search/users?q=${q}`

export const main = <F extends URIS>(F: Main<F>): _<F, Option<number>> =>
  F.putStrLn('Who are you?')
    .chain(() => F.getStrLn)
    .chain(name => F.putStrLn('Loading your Github profile...').chain(() => F.finish(name)))
    .chain(
      compose(
        F.httpLoad,
        githubUrl
      )
    )
    .chain(({ items }) =>
      head(items).fold(
        F.putStrLn(`No such profile found!`).chain(() => F.finish(none)),
        ({ score }) => F.putStrLn(`Your score is ${score}`).chain(() => F.finish(some(score)))
      )
    )
    .chain(F.finish)
