type Handler = (appId: number) => void;

let _handler: Handler | null = null;

export function registerOpenAppHandler(fn: Handler) {
  _handler = fn;
  return () => { _handler = null; };
}

export function emitOpenApp(appId: number) {
  _handler?.(appId);
}
