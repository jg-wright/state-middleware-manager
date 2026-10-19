import { describe, it } from 'node:test'
import { compose } from '../src/index.ts'
import { setTimeout } from 'node:timers/promises'
import { deepEqual, strictEqual } from 'node:assert/strict'

describe('reducer', () => {
  it('waits until all middleware has resolved', async ({ mock }) => {
    const spyA = mock.fn()
    const spyB = mock.fn()

    const fn = compose(
      async (state, next) => {
        await setTimeout(10)
        spyA()
        await next(state)
      },
      async (state, next) => {
        await setTimeout(10)
        spyB()
        return next(state)
      },
    )

    await fn({})

    strictEqual(spyA.mock.callCount(), 1)
    strictEqual(spyB.mock.callCount(), 1)
  })

  it('runs middleware in order', async ({ mock }) => {
    const spyA = mock.fn()
    const spyB = mock.fn()

    const fn = compose(
      async (state, next) => {
        await setTimeout(0)
        spyA()
        strictEqual(spyB.mock.callCount(), 0)
        await next(state)
      },
      async (state, next) => {
        strictEqual(spyA.mock.callCount(), 1)
        await setTimeout(10)
        spyB()
        await next(state)
      },
    )

    await fn({})
  })

  it('can change order by calling next early', async ({ mock }) => {
    const spyA = mock.fn()
    const spyB = mock.fn()

    const fn = compose(
      async (state, next) => {
        await next(state)
        strictEqual(spyB.mock.callCount(), 1)
        spyA()
      },
      (state, next) => {
        strictEqual(spyA.mock.callCount(), 0)
        spyB()
        return next(state)
      },
    )

    await fn({})

    strictEqual(spyA.mock.callCount(), 1)
  })

  it("overrides the state with whatever's passed to next()", async () => {
    await compose(
      (state, next) => {
        strictEqual(state, 'start')
        return next({ foo: 'bar' })
      },
      (state, next) => {
        deepEqual(state, { foo: 'bar' })
        return next({ mung: 'face' })
      },
      (state, next) => {
        deepEqual(state, { mung: 'face' })
        return next(state)
      },
    )('start')
  })
})
