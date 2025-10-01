import net from "net";

const server = net.createServer();

function newConn(socket: net.Socket) {
	console.log(
		`New connection from ${socket.remoteAddress}:${socket.remotePort}`,
	);

	socket.on("end", () => {
		console.log("received FIN\n\n");
	});

	socket.on("data", (data: Buffer) => {
		if (data.length > 0) {
			console.log("data:\n", data.toLocaleString());
			socket.write(data);
		}

		if (data.includes("q")) {
			console.log("closing...");
			socket.end();
		}
	});
}

server.on("error", (err: Error) => {
	throw err;
});
server.on("connection", newConn);
console.log("server listening on port 8080");
server.listen("8080");
