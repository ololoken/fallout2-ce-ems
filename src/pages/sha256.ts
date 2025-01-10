export default (blob: Blob) => blob.arrayBuffer()
  .then(data => crypto.subtle.digest('SHA-256', data))
  .then((hashBuffer) => Array.from(new Uint8Array(hashBuffer))
      .map((bytes) => bytes.toString(16).padStart(2, '0'))
      .join(''));
