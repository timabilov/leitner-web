
import { StyleSheet, View, Text } from 'react-native';

// import MarkdownIt from 'markdown-it';
import  {ASTNode, MarkdownIt} from 'react-native-markdown-display';
import MarkdownItMath from 'markdown-it-mathjax3';
import MathView, { MathText } from 'react-native-math-view';

const markdownItInstance = new MarkdownIt({
    typographer: true,
  }).use(MarkdownItMath, {
    inlineOpen: '\\(',
    inlineClose: '\\)',
    blockOpen: '\\[',
    blockClose: '\\]',
  });


// Inject MathJax script into WebView
const mathJaxHtml = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
  <style>
    body { font-family: Arial; padding: 10px; }
    .math { font-size: 16px; }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;

export const renderEquation = (node: ASTNode) => {
const { content } = node;

try {
    return <MathView
    math='\cos\left(x\right)=\frac{b}{c}'
 />
} catch (error) {
    return <Text>content</Text>;
}
};
export default markdownItInstance;