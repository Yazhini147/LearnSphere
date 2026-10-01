import { pool } from '../../database/pool';

export interface TagWithCount {
  id: string;
  name: string;
  slug: string;
  courseCount: number;
}

export class TagsService {
  async getAllTags(): Promise<TagWithCount[]> {
    const query = `
      SELECT 
        t.id, 
        t.name, 
        t.slug, 
        COUNT(c.id)::int AS "courseCount"
      FROM tags t
      LEFT JOIN course_tags ct ON t.id = ct.tag_id
      LEFT JOIN courses c ON ct.course_id = c.id AND c.status = 'published'
      GROUP BY t.id, t.name, t.slug
      ORDER BY t.name ASC
    `;
    const res = await pool.query(query);
    return res.rows;
  }
}

export const tagsService = new TagsService();
