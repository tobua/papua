export default async function handler(request, response) {
  const { max = 999 } = request.params || request.query // params for express and query for serverless
  const randomNumber = Math.floor(Math.random() * (max - 0 + 1) + 0)
  response.status(200).json({ count: randomNumber })
}
