import net from "net";

const server = net.createServer({ pauseOnConnect: true }); // required by TCPConn

// A promise-based API for TCP sockets
type TCPConn = {
	socket: net.Socket;
	ended: boolean; // EOF, from the "end" event
	err: null | Error; // from the "error event"
	reader: null | {
		resolve: (value: Buffer) => void;
		reject: (reason: Error) => void;
	};
};

function soInit(socket: net.Socket): TCPConn {
	const conn: TCPConn = {
		socket: socket,
		ended: false,
		err: null,
		reader: null,
	};

	socket.on("data", (data: Buffer) => {
		console.assert(conn.reader);

		conn.socket.pause(); // pause "data" until next read

		conn.reader!.resolve(data); // fulfill the promise of the current read
		conn.reader = null;
	});

	socket.on("end", () => {
		conn.ended = true;
		if (conn.reader) {
			conn.reader.resolve(Buffer.from("")); // EOF
			conn.reader = null;
		}
	});

	socket.on("error", (err: Error) => {
		conn.err = err;
		if (conn.reader) {
			conn.reader.reject(err);
			conn.reader = null;
		}
	});

	return conn;
}

function soRead(conn: TCPConn): Promise<Buffer> {
	console.assert(!conn.reader); // no concurrent calls
	return new Promise<Buffer>((resolve, reject) => {
		if (conn.err) {
			reject(conn.err);
			return;
		}

		if (conn.ended) {
			resolve(Buffer.from("")); // EOF
			return;
		}

		conn.reader = { resolve: resolve, reject: reject }; // save the promise callback
		conn.socket.resume(); // and resume "data" event to fulfill the promise later
	});
}

function soWrite(conn: TCPConn, data: Buffer): Promise<void> {
	console.assert(data.length > 0);
	return new Promise<void>((resolve, reject) => {
		if (conn.err) {
			reject(conn.err);
			return;
		}

		conn.socket.write(data, (err?: Error) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

// echo server
async function serveClient(socket: net.Socket): Promise<void> {
	const conn: TCPConn = soInit(socket);

	while (true) {
		const data = await soRead(conn);

		if (data.length === 0) {
			console.log("end connection");
			break;
		}

		console.log(data.toLocaleString());
		await soWrite(conn, data);
	}
}

async function newConn(socket: net.Socket) {
	console.log("new connection", socket.remoteAddress, socket.remotePort);

	try {
		await serveClient(socket);
	} catch (error) {
		console.error("exception:", error);
	} finally {
		socket.destroy();
	}
}

server.on("connection", newConn);
console.log("listening on port 8090");
server.listen("8090");
