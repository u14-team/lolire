import { Lolire } from './lolire';
import * as Server from 'socket.io';
import { Session, Account } from './accountManager';

// States botlist, bot, console
export class WsServer {
  core: Lolire;
  io: any;

  constructor(core: Lolire) {
    this.core = core;
  }

  start() {
    this.io = new Server(this.core.server.server, {
      path: '/rtc'
    });

    this.io.on('connection', this.newConnection.bind(this));
    this.io.origins('*:*');
  }

  emitSocket(event: string, object: any, socket: any, states: string[] = null) {
    if (states !== null && !states.find(v => v === socket.state.builded)) {
      return false;
    }

    socket.emit(event, object);
    return true;
  }

  emitIf(event: string, object: any, condition: (socket) => {}) {
    if (!this.io) {
      return 0;
    }

    let emitted = 0;
    Object.values(this.io.sockets.sockets).forEach((v: any) => {
      if (!condition(v)) {
        return;
      }
  
      v.emit(event, object);
      emitted++;
    });
    
    return emitted;
  }

  emitLogin(event: string, object: any, login: string, states: string[] = null) {
    return this.emitIf(event, object, socket =>
      socket.account.login !== login
        && (states === null || states.find(v => socket.state && v === socket.state.builded))
    );
  }

  emitId(event: string, object: any, id: number, states: string[] = null) {
    return this.emitIf(event, object, ({ account }) => account && account.id === id);
  }

  emitState(event: string, object: any, state: string) {
    return this.emitIf(event, object, v => v.state && state === v.state.builded);
  }

  async newConnection(socket) {
    const ip = socket.handshake.headers['x-real-ip'] ? socket.handshake.headers['x-real-ip'] : socket.handshake.address;
    this.core.logger.log(`New socket: ${ip}`);
    if (!await this.authSocket(socket)) {
      this.core.logger.log(`${ip}: auth failed.`);
      socket.disconnect();
    }

    socket.emit('connecting', 'success');
  }

  async authSocket(socket) {
    const { token } = socket.handshake.query;
    if (!token) {
      socket.emit('connecting', { slug: 'invalid_token', data: { token } });
      return false;
    }

    const session = await Session.findOne({ where: { token } });
    if (!session || !session.isLive(this.core)) {
      socket.emit('connecting', { slug: 'invalid_token', data: { token } });
      return false;
    }

    const ip = socket.handshake.headers['x-real-ip'] ? socket.handshake.headers['x-real-ip'] : socket.handshake.address;
    if (session.ip !== ip) {
      this.core.logger.log(`${ip}: auth failed (invalid_token_ip: ${session.ip}).`);
      socket.emit('connecting', { slug: 'invalid_token_ip', data: { ip: socket.handshake.address } });
      return false;
    }

    const account = await Account.findOne({ where: { login: session.login } });
    if (!account) {
      socket.emit('connecting', { slug: 'internal_error', data: null });
      return false;
    }

    await session.use();
    socket.account = account;
    socket.session = session;

    socket.on('state', newState => {
      socket.state = {
        builded: `${newState.slug}${newState.data ? `:${newState.data}` : ''}`,
        ...newState
      };
    });

    return true;
  }
}