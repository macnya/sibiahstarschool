-- Enforce a 10 MB cap and image-only uploads at the storage level
-- (the admin forms already check this in the browser).
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
 where id = 'media';
