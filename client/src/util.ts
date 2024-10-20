
export async function getFromCacheOrCalculate<T>(key: string, calculate: () => Promise<T>): Promise<T> {
    if (localStorage.getItem(key)) {
        return JSON.parse(localStorage.getItem(key)!);
    }
    const value = await calculate();
    localStorage.setItem(key, JSON.stringify(value));
    return value;
}
