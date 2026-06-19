export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-[var(--color-text)]">隐私政策</h1>
      
      <div className="space-y-6 text-[var(--color-text-secondary)]">
        <section>
          <p className="mb-4">最后更新日期：2026年6月19日</p>
          <p>知味（以下简称"本应用"）尊重并保护您的隐私。本隐私政策说明了我们如何收集、使用和保护您的个人信息。</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">一、信息收集</h2>
          <p className="mb-2">当您使用本应用时，我们可能收集以下信息：</p>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>账户信息</strong>：邮箱地址、昵称（用于创建和管理您的账户）</li>
            <li><strong>食谱数据</strong>：您创建的食谱、食材、步骤等信息</li>
            <li><strong>使用数据</strong>：购物清单、用餐计划、收藏夹、做菜记录等</li>
            <li><strong>上传内容</strong>：您上传的食谱图片（JPEG、PNG、WebP、GIF格式，最大5MB）</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">二、信息使用</h2>
          <p className="mb-2">我们收集的信息用于：</p>
          <ul className="list-inside list-disc space-y-1">
            <li>提供食谱管理、购物清单、用餐计划等核心功能</li>
            <li>在您登录的设备间同步数据</li>
            <li>维护账户安全和提供客户支持</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">三、信息存储与保护</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>本地存储</strong>：食谱、购物清单等数据存储在您的设备本地（IndexedDB）</li>
            <li><strong>云端同步</strong>：登录后，数据会加密传输并存储在 Cloudflare 服务器上</li>
            <li><strong>安全措施</strong>：我们使用加密传输（HTTPS）、访问控制等安全措施保护您的数据</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">四、信息共享</h2>
          <p>我们不会将您的个人信息出售、交易或转让给第三方。仅在以下情况下可能共享：</p>
          <ul className="list-inside list-disc space-y-1 mt-2">
            <li>获得您的明确同意</li>
            <li>法律法规要求</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">五、您的权利</h2>
          <p className="mb-2">您有权：</p>
          <ul className="list-inside list-disc space-y-1">
            <li>访问、修改或删除您的个人信息</li>
            <li>导出您的所有数据</li>
            <li>注销账户并删除所有云端数据</li>
            <li>选择不使用云端同步功能</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">六、未成年人保护</h2>
          <p>本应用不面向13岁以下的未成年人。如果我们发现收集了未成年人的信息，会立即删除相关数据。</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">七、隐私政策更新</h2>
          <p>我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并注明最新更新日期。</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">八、联系我们</h2>
          <p>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
          <p className="mt-2">邮箱：nianshu2022@163.com</p>
        </section>
      </div>
    </div>
  )
}