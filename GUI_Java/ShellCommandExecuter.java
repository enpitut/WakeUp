import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.StringWriter;

public class ShellCommandExecuter implements Runnable {

    private StringWriter sWriter; // 出力された文字列を受けとるためのオブジェクト
    private PrintWriter pWriter; // 出力された文字列を受けとるためのオブジェクト
    private BufferedReader buffReader; // 標準出力
    private BufferedReader errorBuffReader; // エラー出力

    public static void main(String[] args) {
	ShellCommandExecuter sce = new ShellCommandExecuter();
	try{
	    String result = sce.doExec(new String[]{"ls"}); // 実際に実行するコマンド
	    System.out.println(result); // 標準出力とエラー出力の内容
	}catch(Exception e){
	    e.printStackTrace();
	}
    }

    /**
     * 外部コマンドを実行する。
     * 配列形式で渡すためにラップしてる
     * @param command 実行する外部コマンド
     * @return String 外部コマンドが標準出力に出力する実行結果
     * @throws IOException
     */
    public String doExec(String command) throws IOException{
	return doExec(new String[]{command});
    }

    /**
     * 外部コマンドを実行する。
     * @param commands 実行する外部コマンド（空白や引数を渡すための配列形式）
     * @return String 外部コマンドが標準出力に出力する実行結果
     * @throws IOException
     */
    public String doExec(String[] commands) throws IOException{
	// ランタイムオブジェクト取得
	Runtime rt = Runtime.getRuntime();
	// 実行しているディレクトリを指定してコマンドを実行（用途に合わせてパスや環境変数を追加する必要あり）
	Process proc = rt.exec(commands, null, new File(Thread.currentThread().getContextClassLoader().getResource("").getPath()));
	// 実行結果の取得用のオブジェクトの作成
	buffReader = new BufferedReader(new InputStreamReader(proc.getInputStream()));
	errorBuffReader = new BufferedReader(new InputStreamReader(proc.getErrorStream()));
	sWriter = new StringWriter();
	pWriter = new PrintWriter(sWriter);

	// 出力結果を読み終わるまで待つ。
	Thread th = new Thread(this);
	th.start();
	try {
	    th.join();
	} catch (InterruptedException e) {
	    throw new IOException(e);
	}finally{
	    buffReader.close();
	    errorBuffReader.close();
	    pWriter.close();
	}
	// 結果を取得
	return sWriter.toString();
    }

    /**
     * コマンドの実行結果を読み出す。
     * @see java.lang.Runnable#run()
     */
    public void run() {
	try {
	    while(buffReader.ready()) {
		pWriter.println(buffReader.readLine());
	    }
	    while(errorBuffReader.ready()) {
		pWriter.println(errorBuffReader.readLine());
	    }
	} catch (IOException e) {
	    e.printStackTrace();
	}
    }
}