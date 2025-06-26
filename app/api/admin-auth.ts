import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.status(200).end();
  } else {
    res.status(401).end();
  }
}
