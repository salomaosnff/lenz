function createRequest(command, args = {}) {
  const form = new FormData();

  for (const key in args) {
    const value_as_array = Array.isArray(args[key]) ? args[key] : [args[key]];

    for (const value of value_as_array) {
      form.append(key, value);
    }
  }

  return {
    url: `http://localhost:5369/${command}`,
    method: "POST",
    headers: new Headers(),
    body: form,
  };
}

function isContentTypePlainText(contentType) {
  return contentType.includes("text/plain");
}

function isContentTypeJson(contentType) {
  return contentType.includes("application/json");
}

function isContentTypeBinary(contentType) {
  return contentType.includes("application/octet-stream");
}

export class InvokeError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvokeError";
  }
}

function parseResponse({
  resultType = "void",
  contentType,
  text = () => "",
  json = () => null,
  binary = () => new ArrayBuffer(0),
} = {}) {
  if (resultType === "void") {
    return;
  }

  if (resultType === "text" && isContentTypePlainText(contentType)) {
    return text();
  }

  if (resultType === "error" && isContentTypePlainText(contentType)) {
    const result = text();

    if (result instanceof Promise) {
      return result.then((text) => Promise.reject(new InvokeError(text)));
    }

    throw new InvokeError(result);
  }

  if (resultType === "binary" && isContentTypeBinary(contentType)) {
    return binary();
  }

  if (resultType === "json" && isContentTypeJson(contentType)) {
    return json();
  }

  console.error("Invalid response", {
    resultType,
    contentType,
  });
}

export function invoke(command, args = {}) {
    const { body, headers, method, url } = createRequest(command, args);

  return fetch(url, {
    method,
    headers,
    body,
  }).then((response) =>
    parseResponse({
      contentType: response.headers.get("Content-Type"),
      resultType: response.headers.get("X-Invoke-Result"),
      text: () => response.text(),
      json: () => response.json(),
      binary: () => response.arrayBuffer(),
    })
  );
}

export function invokeSync(command, args = {}) {
  const { body, headers, method, url } = createRequest(command, args);

  const xhr = new XMLHttpRequest();

  xhr.open(method, url, false);

  for (const [key, value] of headers.entries()) {
    xhr.setRequestHeader(key, value);
  }

  xhr.send(body);

  return parseResponse({
    contentType: xhr.getResponseHeader("Content-Type"),
    resultType: xhr.getResponseHeader("X-Invoke-Result"),
    text: () => xhr.responseText,
    json: () => JSON.parse(xhr.responseText),
    binary: () => xhr.response instanceof ArrayBuffer ? xhr.response : new TextEncoder().encode(xhr.responseText),
  });
}
