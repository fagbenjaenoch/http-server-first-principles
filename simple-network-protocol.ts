type dynBuf = {
	data: Buffer;
	length: number;
};

function pushBuf(buf: dynBuf, data: Buffer) {
	const newLen = buf.length + data.length;

	if (buf.data.length < newLen) {
		let cap = Math.max(buf.data.length, 32);
		while (cap < newLen) {
			cap *= 2;
		}
		const grown = Buffer.alloc(cap);
		buf.data.copy(grown, 0);
		buf.data = grown;
	}

	data.copy(buf.data, buf.length, 0);
	buf.length = newLen;
}
