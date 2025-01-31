import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { Button } from './ui/button';
 
export async function Form() {
  async function uploadImage(formData: FormData) {
    'use server';
    const imageFile = formData.get('image') as File;
    const blob = await put(imageFile.name, imageFile, {
      access: 'public',
    });
    revalidatePath('/');
    return blob;
  }
 
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      await uploadImage(formData);
    }}>
      <label htmlFor="image">Image</label>
      <input type="file" id="image" name="image" required />
      <Button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
          Upload
        </Button>

    </form>
  );
}