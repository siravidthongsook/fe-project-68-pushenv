import { AnchorButton, Badge, Panel, StatCard } from '@/components/shadcn-ui';

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge tone="accent">ระบบจองสัมภาษณ์สำหรับนักศึกษา</Badge>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.24] text-ink-900 sm:text-6xl sm:leading-[1.24]">
              จองสัมภาษณ์ได้อย่างเป็นระบบ เพื่อการใช้งานที่ชัดเจน
            </h1>
            <p className="max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
              ออกแบบให้ทั้งนักศึกษา ติดตามรายการจองได้ง่าย และจัดการทุกขั้นตอนในที่เดียว
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <AnchorButton href="/companies">ดูรายชื่อบริษัท</AnchorButton>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="ผู้ใช้งานที่ใช้งานอยู่" value="2,480" />
            <StatCard label="บริษัทที่เข้าร่วม" value="186" />
            <StatCard label="การจองที่สำเร็จ" value="8,420" />
          </div>
        </div>

        <div className="flex h-full flex-col lg:pt-24">
          <Panel className="flex flex-1 flex-col overflow-hidden p-0">
            <div className="border-b border-ink-200 bg-ink-900 px-6 py-5 text-white">
              <p className="eyebrow text-white/65">ภาพรวมระบบ</p>
              <h2 className="mt-2 font-display text-2xl">ใช้งานได้ทั้งสองฝ่าย</h2>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 p-6">
              {[
                ['สำหรับนักศึกษา', 'ค้นหาบริษัท จองสัมภาษณ์ และติดตามรายการจองได้ในหน้าเดียว'],
                ['สำหรับสถานประกอบการ', 'รับข้อมูลการจองจากนักศึกษาอย่างเป็นระบบและจัดการได้ง่าย'],
                ['ความน่าเชื่อถือ', 'เก็บข้อมูลและสถานะการจองไว้ในระบบเดียวเพื่อความมั่นใจ'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl border border-ink-200 bg-white px-4 py-4">
                  <p className="font-semibold text-ink-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-600">{desc}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
