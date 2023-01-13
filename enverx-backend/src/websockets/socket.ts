import { Logger } from '@config/logger'
import { Socket, Server } from 'socket.io'

class SocketEvents {
	socket: Socket
	io: Server
}

const socketEvents = new SocketEvents()

export default socketEvents
