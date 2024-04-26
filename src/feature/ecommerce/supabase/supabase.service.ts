import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';


@Injectable()
export class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(process.env.NEST_PUBLIC_SUPABASE_URL, process.env.NEST_PUBLIC_SUPABASE_ANON_KEY);
  }

  async getSupabaseStorageImage(imageFilename, supabase): Promise<string> {
    const { data } = supabase.storage.from('datn.product').getPublicUrl(imageFilename)
  
    if (data) {
      return data.publicUrl
    }
  }

  async uploadImageAndGetLink(imagesBase64: string[]): Promise<string[]> {
    try {
      // Phân tích loại ảnh từ chuỗi base64
      const imagesUrl = [];
      for (const imageBase64 of imagesBase64){
        const typeMatch = imageBase64.match(/^data:image\/(.*);base64,/);
        const httpMatch = imageBase64.match(/^http/);
        if (httpMatch) {
          imagesUrl.push(imageBase64);
          continue;
        }

        if (!typeMatch) {
          throw new Error('Invalid image data');
        }
        else {
          const imageType = typeMatch[1];
    
          // Chuyển chuỗi base64 thành dữ liệu nhị phân
          const imageData = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
          // Tải lên hình ảnh lên Supabase với định dạng tương ứng
          const imageName = "products/" + uuidv4();
          const { data, error } = await this.supabase.storage
            .from('datn.product')
            .upload(imageName, imageData, {
              contentType: `image/${imageType}`, // Sử dụng loại ảnh phân tích được
            });
      
          if (error) {
            throw new Error(error.message);
          }
          const imageUrl = await this.getSupabaseStorageImage(imageName, this.supabase);
          imagesUrl.push(imageUrl);
        }
      }
      return imagesUrl;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
