export async function callHelloFuncFromBackend() {
    const response = await fetch("http://localhost:5194/api/hello");
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
}