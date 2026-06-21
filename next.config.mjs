import createMDX from '@next/mdx'
import withPWAInit from '@ducanh2912/next-pwa'

const withMDX = createMDX({
  options: { remarkPlugins: [['remark-gfm']], rehypePlugins: [['rehype-slug'], ['rehype-autolink-headings']] },
})
const withPWA = withPWAInit({ dest: 'public', disable: process.env.NODE_ENV === 'development' })

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: { unoptimized: true },
  trailingSlash: true,
}
export default withPWA(withMDX(config))
