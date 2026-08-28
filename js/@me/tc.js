/**
 * @private
 * @param {function} errorType
 * @param {string} parameterName
 * @param {string} readableTypeDescription
 */
const makeErrorMessage = (
  errorType,
  parameterName,
  readableTypeDescription,
) => (`An instance of '${errorType.name}' was about to be thrown but the error constructor was called incorrectly: argument '${parameterName}' was not ${readableTypeDescription}.`)

export class AssertionError extends Error {
  name = "AssertionError"

  constructor(message = "") {
    super(message)
    if (typeof message !== "string") {
      // Do not modify the 'stack' property in this case.
      throw new TypeError(makeErrorMessage(AssertionError, "message", "a string"))
    }
    // @ts-ignore
    Error.captureStackTrace?.(this, AssertionError)
  }
}

/**
 * Just throws an error.
 * Useful e.g. to let TypeScript know that some value cannot be nullish.
 * @example let user = userMap.get(userName) ?? tc.never()
 * @throws {Error}
 * @type () => never
 */
export function never () {
  throw new Error("An exception occurred.")
}

/**
 * Creates and throws a custom 'AssertionError' instance.
 *
 * @param {string} [message]
 * @param {function} [thrower] - A function that should not show up in the
 *   stack trace of the generated error.
 * @throws {AssertionError}
 * @type (message?: string, thrower?: function) => never
 */
export function throwNewAssertionError(message = "", thrower) {
  if (typeof message !== "string") {
    // Do not attempt to modify the 'stack' property in this case.
    throw new TypeError(makeErrorMessage(AssertionError, "message", "a string"))
  }
  const error = new AssertionError(message)
  if ("1" in arguments) {
    if (typeof thrower !== "function") {
      throw new TypeError(makeErrorMessage(TypeError, "thrower", "a function"))
    }
    // @ts-ignore
    Error.captureStackTrace?.(error, thrower)
  }
  throw error
}
/**
 * Creates and throws a custom 'TypeError' instance.
 *
 * @param {string} typeDescription - A non-empty and preferably readable
 *   description of the type which was expected.
 * @param {function} [thrower] - A function that should not show up in the
 *   stack trace of the generated error.
 * @throws {TypeError}
 * @type (typeDescription: string, thrower?: function) => never
 */
export function throwNewTypeError(typeDescription, thrower) {
  if (typeof typeDescription !== "string" || typeDescription === "") {
    // Do not attempt to modify the 'stack' property in this case.
    throw new TypeError(makeErrorMessage(TypeError, "typeDescription", "a non-empty string"))
  }
  const error = new TypeError(`expected ${typeDescription}.`)
  if ("1" in arguments) {
    if (typeof thrower !== "function") {
      throw new TypeError(makeErrorMessage(TypeError, "thrower", "a function"))
    }
    // @ts-ignore
    if (typeof Error.captureStackTrace === "function") {
      // @ts-ignore
      Error.captureStackTrace(error, thrower)
    }
  }
  throw error
}

/**
 * @param {boolean} arg - A value to test.
 * @param {string} [message=""]
 * @param {(string | object)} [cause=""]
 * @throws {AssertionError} If 'arg' is not 'true'.
 * @type (arg: boolean, message?: string, cause?: object | string) => asserts arg
 */
export function assert(arg, message = "", cause = "") {
  if (typeof arg !== "boolean") {
    throwNewTypeError("a boolean value")
  }
  if (typeof message !== "string") {
    throwNewTypeError("a string")
  }
  if (arg !== true) {
    if (cause && typeof cause === "object") {
      try {
        cause = JSON.stringify(message)
      } catch {
        throw new Error("Could not stringify the given 'message'")
      }
    }
    if (typeof cause !== "string") {
      throwNewTypeError("a string")
    }
    throwNewAssertionError(message)
  }
}
