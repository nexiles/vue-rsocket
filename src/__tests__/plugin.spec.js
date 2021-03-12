import { createLocalVue, mount } from '@vue/test-utils';
import * as Main from '../plugin';
import io from '../__mocks__/socket.io-client';

it('should be vue plugin (is an object with `install` method)', () => {
  expect(Main).toMatchObject({
    install: expect.any(Function),
  });
});

describe('.install()', () => {
  let Vue;
  beforeEach(() => {
    Vue = createLocalVue();
  });

  it('should accept 3 arguments', () => {
    expect(Main.install).toHaveProperty('length', 3);
  });

  it('should throw an error when no second argument passed', () => {
    expect(() => Vue.use(Main))
      .toThrowErrorMatchingSnapshot();
  });

  it('should throw an error when second argument is not socket.io instance', () => {
    expect(() => Vue.use(Main, { a: 1 }))
      .toThrowErrorMatchingSnapshot();
    expect(() => Vue.use(Main, 'ws://localhost'))
      .toThrowErrorMatchingSnapshot();
  });

  it('should not throw an error when second argument is socket.io instance', () => {
    const socket = io('ws://localhost');
    expect(() => Vue.use(Main, socket))
      .not
      .toThrow();
  });

  it('defines socket.io instance as `$socket.client` on Vue prototype', () => {
    Vue.use(Main, io('ws://localhost'));
    const wrapper = mount({ render: () => null }, { localVue: Vue });
    expect(wrapper.vm.$socket.client).toBeDefined();
    expect(wrapper.vm.$socket.client).toEqual(expect.any(Object));
    expect(wrapper.vm.$socket.client.on).toEqual(expect.any(Function));
    expect(wrapper.vm.$socket.client.emit).toEqual(expect.any(Function));
  });

  it('defines reactive property `$socket.connected` on Vue prototype', () => {
    const socket = io('ws://localhost');
    Vue.use(Main, socket);
    const wrapper = mount({ render: () => null }, { localVue: Vue });
    expect(wrapper.vm.$socket.connected).toBeDefined();
    expect(wrapper.vm.$socket.connected).toBe(false);
    socket.fireSystemEvent('connect');
    expect(wrapper.vm.$socket.connected).toBeDefined();
    expect(wrapper.vm.$socket.connected).toBe(true);
    socket.fireSystemEvent('disconnect');
    expect(wrapper.vm.$socket.connected).toBeDefined();
    expect(wrapper.vm.$socket.connected).toBe(false);
  });

  it('defines reactive property `$socket.disconnected` on Vue prototype', () => {
    const socket = io('ws://localhost');
    Vue.use(Main, socket);
    const wrapper = mount({ render: () => null }, { localVue: Vue });
    expect(wrapper.vm.$socket.disconnected).toBeDefined();
    expect(wrapper.vm.$socket.disconnected).toBe(true);
    socket.fireSystemEvent('connect');
    expect(wrapper.vm.$socket.disconnected).toBeDefined();
    expect(wrapper.vm.$socket.disconnected).toBe(false);
    socket.fireSystemEvent('disconnect');
    expect(wrapper.vm.$socket.disconnected).toBeDefined();
    expect(wrapper.vm.$socket.disconnected).toBe(true);
  });

  it('registers mixin on Vue', () => {
    const spy = jest.spyOn(Vue, 'mixin');
    Vue.use(Main, io('ws://localhost'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.any(Object));
  });

  it('correctly merges `sockets` property of the mixin and the component', () => {
    Vue.use(Main, io('ws://localhost'));
    const mixinListener = jest.fn();
    const componentListener = jest.fn();
    const someMixin = {
      sockets: { mixinListener },
    };
    const wrapper = mount({
      mixins: [someMixin],
      render: () => null,
      sockets: { componentListener },
    }, { localVue: Vue });

    expect(wrapper.vm.$options.sockets).toMatchObject({
      mixinListener,
      componentListener,
    });
  });
});

describe('.defaults', () => {
  it('is an object', () => {
    expect(Main.defaults).toEqual(expect.any(Object));
  });

  it('contains default plugin options', () => {
    expect(Main.defaults).toMatchObject({
      actionPrefix: expect.any(String),
      mutationPrefix: expect.any(String),
      eventToMutationTransformer: expect.any(Function),
      eventToActionTransformer: expect.any(Function),
    });
  });

  it('all values are read-only', () => {
    Object.keys(Main.defaults)
      .forEach((prop) => {
        const fn = () => {
          Main.defaults[prop] = 'newValue';
        };
        expect(fn).toThrow('Cannot assign to read only property');
      });
  });
});
