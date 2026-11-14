#import <AppKit/AppKit.h>

// Mechanical export from preserved source boards and their manifest geometry.
// Build: clang -O2 -fobjc-arc -framework AppKit tools/export-character-strips.m -o /tmp/export-character-strips
// Usage: /tmp/export-character-strips production/sprites/source/majis-v2 <sequence>...
static CGContextRef canvas(size_t w,size_t h){
 CGColorSpaceRef space=CGColorSpaceCreateDeviceRGB();
 CGContextRef c=CGBitmapContextCreate(NULL,w,h,8,w*4,space,(CGBitmapInfo)kCGImageAlphaPremultipliedLast);
 CGColorSpaceRelease(space);return c;
}
static void png(CGImageRef image,NSString*file){
 NSBitmapImageRep*r=[[NSBitmapImageRep alloc]initWithCGImage:image];
 if(![[r representationUsingType:NSBitmapImageFileTypePNG properties:@{}]writeToFile:file atomically:YES]){fprintf(stderr,"Cannot write %s\n",file.UTF8String);exit(3);}
}
int main(int argc,const char**argv){@autoreleasepool{
 if(argc<3)return 2;
 NSString*root=@(argv[1]);
 NSDictionary*m=[NSJSONSerialization JSONObjectWithData:[NSData dataWithContentsOfFile:[root stringByAppendingPathComponent:@"manifest.json"]] options:0 error:nil];
 if(strcmp(argv[2],"--overview")==0){
  NSArray*items=m[@"sequences"];NSInteger rows=(items.count+7)/8,W=1536,H=rows*224+54;
  NSBitmapImageRep*r=[[NSBitmapImageRep alloc]initWithBitmapDataPlanes:NULL pixelsWide:W pixelsHigh:H bitsPerSample:8 samplesPerPixel:4 hasAlpha:YES isPlanar:NO colorSpaceName:NSDeviceRGBColorSpace bytesPerRow:0 bitsPerPixel:0];
  [NSGraphicsContext saveGraphicsState];[NSGraphicsContext setCurrentContext:[NSGraphicsContext graphicsContextWithBitmapImageRep:r]];
  [[NSColor colorWithCalibratedWhite:.12 alpha:1]setFill];NSRectFill(NSMakeRect(0,0,W,H));
  NSDictionary*title=@{NSFontAttributeName:[NSFont boldSystemFontOfSize:21],NSForegroundColorAttributeName:NSColor.whiteColor};
  [@"MAJIS — escala corrigida; prévia do primeiro quadro de cada sequência"drawAtPoint:NSMakePoint(16,H-34) withAttributes:title];
  NSDictionary*label=@{NSFontAttributeName:[NSFont systemFontOfSize:14],NSForegroundColorAttributeName:NSColor.whiteColor};
  for(NSInteger i=0;i<items.count;i++){
   NSString*name=items[i][@"name"];NSInteger x=(i%8)*192,y=H-54-(i/8+1)*224;
   [[NSColor colorWithCalibratedWhite:.24 alpha:1]setFill];NSRectFill(NSMakeRect(x+2,y+2,188,188));
   NSImage*im=[[NSImage alloc]initWithContentsOfFile:[root stringByAppendingPathComponent:[NSString stringWithFormat:@"quadros-768/%@-1.png",name]]];
   [im drawInRect:NSMakeRect(x+2,y+2,188,188) fromRect:NSZeroRect operation:NSCompositingOperationSourceOver fraction:1];
   [name drawAtPoint:NSMakePoint(x+7,y+197) withAttributes:label];
  }
  [NSGraphicsContext restoreGraphicsState];
  [[r representationUsingType:NSBitmapImageFileTypePNG properties:@{}]writeToFile:[root stringByAppendingPathComponent:@"visao-geral.png"] atomically:YES];return 0;
 }
 for(int a=2;a<argc;a++){@autoreleasepool{
  NSString*name=@(argv[a]);NSDictionary*s=nil;
  for(NSDictionary*item in m[@"sequences"])if([item[@"name"]isEqualToString:name]){s=item;break;}
  if(!s)return 2;
  NSBitmapImageRep*source=(NSBitmapImageRep*)[NSBitmapImageRep imageRepWithContentsOfFile:[root stringByAppendingPathComponent:s[@"original"]]];
  if(!source||!source.hasAlpha)return 2;
  double scale=[s[@"scale"]doubleValue];if(scale<=0||scale>1)return 2;
  CGContextRef strip=canvas(3072,768);
  for(int i=0;i<4;i++){
   NSDictionary*b=s[@"sourceBounds"][i],*o=s[@"origins"][i];
   double x=[b[@"x"]doubleValue],y=[b[@"y"]doubleValue],w=[b[@"w"]doubleValue],h=[b[@"h"]doubleValue];
   double dx=384+(x-[o[@"x"]doubleValue])*scale;
   double dy=68+([o[@"y"]doubleValue]-y-h)*scale;
   if(dx<0||dx+w*scale>768||dy<0||dy+h*scale>768)return 4;
   CGImageRef crop=CGImageCreateWithImageInRect(source.CGImage,CGRectMake(x,y,w,h));
   CGContextRef cell=canvas(768,768);CGContextSetInterpolationQuality(cell,kCGInterpolationHigh);
   CGContextDrawImage(cell,CGRectMake(dx,dy,w*scale,h*scale),crop);
   CGImageRef image=CGBitmapContextCreateImage(cell);
   png(image,[root stringByAppendingPathComponent:[NSString stringWithFormat:@"quadros-768/%@-%d.png",name,i+1]]);
   CGContextDrawImage(strip,CGRectMake(i*768,0,768,768),image);
   CGImageRelease(image);CGContextRelease(cell);CGImageRelease(crop);
  }
  CGImageRef image=CGBitmapContextCreateImage(strip);
  png(image,[root stringByAppendingPathComponent:s[@"strip"]]);
  CGImageRelease(image);CGContextRelease(strip);
  printf("%s scale %.9f\n",name.UTF8String,scale);
 }}
}return 0;}
