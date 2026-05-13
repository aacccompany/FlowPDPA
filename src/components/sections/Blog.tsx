const posts = [
  { title: 'PDPA คืออะไร? สิ่งที่ธุรกิจไทยทุกขนาดต้องรู้ก่อนเริ่มต้น', date: '01/11/25', tags: ['PDPA', 'เริ่มต้น'] },
  { title: '5 ข้อผิดพลาดที่ธุรกิจไทยมักทำเกี่ยวกับ Privacy Policy', date: '20/10/25', tags: ['Privacy Policy'] },
  { title: 'Privacy Policy กับ Cookie Policy ต่างกันอย่างไร และต้องมีทั้งคู่หรือเปล่า?', date: '10/10/25', tags: ['Privacy Policy', 'Cookie'] },
  { title: 'วิธีเขียน Privacy Policy ที่ลูกค้าอ่านแล้วเข้าใจจริง', date: '05/10/25', tags: ['เคล็ดลับ'] },
  { title: 'PDPA กับธุรกิจ E-Commerce: ต้องทำอะไรบ้างให้ครบ', date: '01/09/25', tags: ['E-Commerce', 'PDPA'] },
  { title: 'ความแตกต่างระหว่าง PDPA, GDPR และ CCPA ที่นักธุรกิจควรรู้', date: '15/08/25', tags: ['GDPR', 'CCPA', 'PDPA'] },
]

export default function Blog() {
  return (
    <section id="blog" className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">FlowPDPA Blog</h2>
          <p className="text-gray-500 mt-2">ความรู้เรื่อง PDPA และการคุ้มครองข้อมูลส่วนบุคคลสำหรับธุรกิจไทย</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {posts.map((post, i) => (
            <a key={i} href="#" className="group block border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-100 h-40 flex items-center justify-center text-gray-300 text-4xl">📄</div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2 group-hover:underline line-clamp-3" style={{ WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.title}
                </h3>
                <p className="text-xs text-gray-400 mb-2">{post.date}</p>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs border border-gray-300 text-gray-500 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center">
          <a
            href="#"
            className="inline-block px-8 py-3 text-sm font-bold rounded border-2 transition-colors"
            style={{ color: 'var(--orange)', borderColor: 'var(--orange)' }}
          >
            อ่านบทความทั้งหมด
          </a>
        </div>
      </div>
    </section>
  )
}
