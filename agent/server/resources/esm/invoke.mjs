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

async function parseResponse({
  resultType = "void",
  contentType,
  text = () => "",
  json = () => null,
  binary = () => new ArrayBuffer(0),
} = {}) {
  if (resultType === "void") {
    return;
  }

  if (resultType === "text" && contentType === "text/plain") {
    return text();
  }

  if (resultType === "error" && contentType === "text/plain") {
    throw new Error(await text());
  }

  if (resultType === "binary" && contentType === "application/octet-stream") {
    return binary();
  }

  if (resultType === "json" && contentType === "application/json") {
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
    binary: () => xhr.response,
  });
}
