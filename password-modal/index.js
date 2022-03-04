import { createMachine, interpret } from 'xstate'
import { assign } from 'xstate/lib/actions'
import './index.scss'

const elApp = document.querySelector('#app')
const elButton = document.querySelector('.ui-submit')
const elPassword = document.querySelector('.ui-password-input')
const elReset = document.querySelector('.ui-reset')

const context = {
  password: '',
}

const actions = {
  assignPassword: assign({
    password: (_, event) => {
      return event.value
    },
  }),
  validatePassword: (ctx) => {
    setTimeout(() => {
      if (ctx.password === 'password') {
        service.send('VALID')
      } else {
        service.send('INVALID')
      }
    }, 2000)
  },
  // 下面这个action很特别，
  // 体现了前端开发如果没有框架 ，
  // 既需要自己维护ctx里面的值
  // 又需要自己手动去更改ui的表现
  clearPassword: assign({
    password: () => {
      elPassword.value = ''
      return ''
    },
  }),
}

const passwordMachine = createMachine({
  initial: 'idle',
  context,
  states: {
    idle: {
      entry: 'clearPassword',
      on: {
        SUBMIT: {
          target: 'validating',
          cond: 'passwordEntered',
        },
        CHANGE: {
          target: 'idle',
          actions: 'assignPassword',
          internal: true,
        },
      },
      initial: 'normal',
      states: {
        normal: {},
        error: {
          after: {
            2000: 'normal',
          },
        },
      },
    },
    validating: {
      onEntry: 'validatePassword',
      on: {
        VALID: 'success',
        INVALID: 'idle.error',
      },
    },
    success: {},
  },
  on: {
    RESET: '.idle',
  },
}).withConfig({
  actions,
  guards: {
    passwordEntered: (ctx) => {
      return ctx.password && ctx.password.length
    },
  },
})

const activate = (state) => {
  elApp.dataset.state = state.toStrings().join(' ')

  document.querySelectorAll('[data-active]').forEach((el) => {
    el.removeAttribute('data-active')
  })

  document.querySelectorAll(`[data-show~="${state.value}"]`).forEach((el) => {
    el.setAttribute('data-active', true)
  })
}

const service = interpret(passwordMachine).onTransition(activate).start()

activate(passwordMachine.initialState)

elButton.addEventListener('click', () => {
  service.send('SUBMIT')
})

elPassword.addEventListener('input', (e) => {
  service.send({
    type: 'CHANGE',
    value: e.target.value,
  })
})

elApp.addEventListener('submit', (e) => {
  e.preventDefault()
  service.send('SUBMIT')
})

elReset.addEventListener('click', () => service.send('RESET'))
