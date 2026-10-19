import type { Middleware } from './Middleware.ts'
import type { MiddlewareComposer } from './MiddlewareComposer.ts'

export const compose: MiddlewareComposer =
  (...middleware: Middleware<unknown, unknown>[]) =>
  async (state: unknown) => {
    if (middleware.length === 0) return state

    let index = -1

    const dispatch = async (i: number, nextState?: unknown): Promise<void> => {
      if (i <= index) throw new Error('next() called multiple times')

      state = nextState
      index = i

      if (i === middleware.length) return

      await middleware[i](state, (state) => dispatch(i + 1, state))
    }

    await dispatch(0, state)
    return state
  }
