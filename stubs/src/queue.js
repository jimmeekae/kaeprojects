export const jobQueue = [];

export function enqueue(job) {
    jobQueue.push(job);
}

export function dequeue() {
    return jobQueue.shift();
}