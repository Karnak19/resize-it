import { ResizeIt } from ".";

export function toNextJsHandler(resizeIt: ResizeIt) {
  return {
    POST: async (req: Request) => {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return new Response("No file provided", { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const fileExtension = file.name.split(".").pop();

      const [year, month, day] = new Date()
        .toISOString()
        .split("T")[0]
        .split("-");

      const resizedImage = await resizeIt.uploadImage(buffer, {
        path: `${year}/${month}/${day}/${new Date().getTime()}-${fileExtension}`,
        contentType: file.type,
      });

      return new Response(JSON.stringify(resizedImage), { status: 200 });
    },
  };
}
